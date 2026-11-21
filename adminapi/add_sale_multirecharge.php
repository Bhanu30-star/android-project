<?php
$response = array();
include("../../connect.php");
if(isset($_POST['user_id']) && isset($_POST['amount']) && isset($_POST['total_order']) && isset($_POST['party_id']) && isset($_POST['payment_mode']) && isset($_POST['payment_status']) && isset($_POST['distributor_id']) && isset($_POST['final_amt']) && isset($_POST['invoice_type']))
{  
	$client1 = $_POST['user_id'];
	$amount = $_POST['amount'];   
	$final_amt = $_POST['final_amt']; 
	$round_off_amt = $_POST['round_off_amt']; 	
	$toder = $_POST['total_order'];
	$p_client = $_POST['party_id']; 
	$poperator = $_POST['poperator'];
	$gstconfig=isset($_POST['gstconfig']) ? $_POST['gstconfig'] : '';
	$party_gstin = isset($_POST['party_gstin']) ? $_POST['party_gstin'] : '';
	$dep_bank_id = isset($_POST['cheque_bank_id']) ? $_POST['cheque_bank_id'] : '0';
	$actual_dsr_requirement=$_POST['dsr_requirement'];
	$pmode = $_POST['payment_mode'];
	$serial_bill = 'No';
	$pstatus = $_POST['payment_status'];
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$invoice_type1=$_POST['invoice_type'];
	$tcs_applicable ='No';
	if($pmode=="Cash")
	{
		$cash_amt=$final_amt;
		$cheque_amt=0;
	}
	else if($pmode=="Online")
	{
		$cash_amt=0;
		$cheque_amt=$final_amt;
	}
	else if($pmode=="Credit")
	{
		$cheque_amt=$cash_amt=0;
	}
	
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$temp_date2=strtotime($da);
	$msg_insert_check=0;
	
	include("../client_bill_sequence.php");
	$SendSequence=new SendSequence();
	$sd=$SendSequence->fetch_sequence($dis_id,$invoice_type1,$con);
	if($sd!='')
	{
		$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
		
		$res = mysqli_query($con,"insert into tbl_party_transaction(transaction_id,transaction_date,transaction_time,transaction_bill_number,transaction_from, transaction_to,total_amount,payment_mode,payment_status,cash_amount,cheque_amount,final_amt,bill_type,round_off_amt,serial_no_bill,bill_date,party_gstin,generated_by,gst_configure,source,is_tcs,operator_detail,bank_id)values('$transaction_id','$da','$scro','$sd','$client1','$p_client','$amount','$pmode','$pstatus','$cash_amt','$cheque_amt','$final_amt','$invoice_type1','$round_off_amt','$serial_bill','$da','$party_gstin','$dis_id','$gstconfig','Admin','$tcs_applicable','$poperator','$dep_bank_id')");
		$re = mysqli_insert_id($con);		
		$json_a=json_decode($toder, true);     
		foreach ($json_a as $person_a)
		{
			$prodid=$person_a['pid'];
			$prodname=$person_a['pname'];
			$ordquantiy=$person_a['quantity'];
			$proprice=$person_a['pro_price'];
			$cgstamt = isset($person_a['cgst_amt']) ? $person_a['cgst_amt'] : '';
			$sgstamt = isset($person_a['sgst_amt']) ? $person_a['sgst_amt'] : '';
			$igstamt = isset($person_a['igstamt']) ? $person_a['igstamt'] : '';
			$pro_gst_perc = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
			$pur_total_amt = isset($person_a['pur_total_amt']) ? $person_a['pur_total_amt'] : '0';
			$pur_taxable_amt = isset($person_a['pur_taxable_amt']) ? $person_a['pur_taxable_amt'] : '0';		
			$query2=mysqli_query($con,"insert into tbl_party_transaction_detail(transaction_id,product_id,product_name,quantity, CGST_amount,SGST_amount,product_price,IGST_amount,gst_perc,product_total_amt,taxable_amount)values('$transaction_id','$prodid','$prodname','$ordquantiy','$cgstamt','$sgstamt','$proprice','$igstamt','$pro_gst_perc','$pur_total_amt','$pur_taxable_amt')");
			
			$query_stock="SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
			$res_stock = mysqli_query($con,$query_stock);
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{
				$stock_quantity=$row_stock['closing_stock'];
				$temp_quantity=round($stock_quantity-$ordquantiy,2);
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity' where date ='$da' and distributor_id='$dis_id' and product_id='$prodid'");	
				$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");	
			}
			else
			{
				$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
				$res_stock1 = mysqli_query($con,$query_stock1);
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				if(mysqli_num_rows($res_stock1)>0)
				{
					$stock_quantity=$row_stock1['closing_stock'];
					$temp_quantity=round($stock_quantity-$ordquantiy,2);
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,closing_stock,opening_stock,date)values('$dis_id','$prodid','$temp_quantity','$stock_quantity','$da')");
					$uq_product=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity' where distributor_id='$dis_id' and product_id='$prodid'");
				}
			}		
		}
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$dis_id', 'INSERT OPERATION,Add Sale Multirecharge#Admin(INSERT) tbl_party_transaction,tbl_party_transaction_detail#(INSERT+UPDATE)tbl_product,tbl_distributor_stock', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
		if($actual_dsr_requirement=="Yes")
		{
			include("cash_bank_effect_class.php");
			if($pmode=='Cash' && $cash_amt>0)
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->cashcollection($dis_id,$cash_amt,$da);
			}
			else if($pmode=='Online' && $cheque_amt>0 && $dep_bank_id>0)
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->bankcollection($dis_id,$dep_bank_id,$cheque_amt,$da);
			}
		}
		$response['success']=1;
		$response['details']=$sd;
		$response['pmode']=$pmode;
	}  		
	else
	{
		$response['success']=0;
		$response['details']="Invoice No Not Generate";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 