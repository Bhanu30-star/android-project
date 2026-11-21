<?php
$response = array();
include("../../connect.php");
if(isset($_POST['key_uid']) && isset($_POST['amount']) && isset($_POST['total_order']) && isset($_POST['key_pid']) && isset($_POST['payment_mode']) && isset($_POST['payment_status']) && isset($_POST['distributor_id']))
{  
	$client1 = $_POST['key_uid'];
	$amount = $_POST['amount'];   
	$toder = $_POST['total_order'];
	$p_client = $_POST['key_pid'];
	$pmode = $_POST['payment_mode'];   
	$pstatus = $_POST['payment_status'];
	$bank_name = isset($_POST['bank_name']) ? $_POST['bank_name'] : '';
	$cheque_no = isset($_POST['cheque_no']) ? $_POST['cheque_no'] : '';
	$cheque_date = isset($_POST['cheque_date']) ? $_POST['cheque_date'] : '';
	$dis_id = $_POST['distributor_id'];
	$remark=$_POST['remark'];
	if($pmode=="Both")
	{
		$cash_amt=$_POST['cash_amount'];
		$cheque_amt=$_POST['cheque_amount'];
	}
	else if($pmode=="Cash")
	{
		$cash_amt=$amount;
		$cheque_amt=0;
	}
	else
	{
		$cash_amt=0;
		$cheque_amt=$amount;
	}
	$check_author = mysqli_query($con,"select dsr_requirement from tbl_distributor where distributor_id='$dis_id'");
	while($row_data = mysqli_fetch_array($check_author))
	{
		$dist_dsr_require=$row_data['dsr_requirement'];
	}
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$temp_date2=strtotime($da);
	
	$message_txn_id = isset($_POST['message_txn_id']) ? $_POST['message_txn_id'] : '';
	$party_number = isset($_POST['party_number']) ? $_POST['party_number'] : '';
	$message_date = isset($_POST['message_date']) ? $_POST['message_date'] : '';
	$message_time = isset($_POST['message_time']) ? $_POST['message_time'] : '';
	$message_amount = isset($_POST['message_amount']) ? $_POST['message_amount'] : '';
	$msg_insert_check=0;
	if($message_txn_id!='')
	{
		$select_message=mysqli_query($con,"select * from `tbl_retailer_message_detail` where user_id='$client1' and transaction_id='$message_txn_id'");
		if(mysqli_num_rows($select_message)<=0)
		{
			$query_message=mysqli_query($con,"insert into tbl_retailer_message_detail(`user_id`,`transaction_id`,`amount`,`message_date`,`message_time`,`party_phone`,`insert_date`,`insert_time`,`status`,`complete_date`,`complete_time`)values('$client1','$message_txn_id','$message_amount','$message_date','$message_time','$party_number','$da','$scro','Complete','$da','$scro')");
			$msg_insert_check=0;
		}
		else
		{
			$msg_insert_check=1;
		}
	}
	if($msg_insert_check==0)
	{
		$temp_explode="";
		$select_order=mysqli_query($con,"select receipt_sequence from `tbl_sequence` where distributor_id='$dis_id'");
		$select_row =  mysqli_fetch_assoc($select_order);
		if(mysqli_num_rows($select_order)>0)
		{
			$temp=$select_row['receipt_sequence'];
			if($temp=="")
			{
				$sd="R00001";
			}
			else
			{
				$final_invoice=(int)substr($temp,1);
				$final_invoice=$final_invoice+1;
				$final_invoice1=(string)$final_invoice;
				$string_count=5-(int)strlen($final_invoice1);
				for($vb=0;$vb<$string_count;$vb++)
				{
					$temp_explode=$temp_explode."0";
				}
				$sd="R".$temp_explode.$final_invoice;
			}
			$uq_sequence=mysqli_query($con,"UPDATE tbl_sequence SET receipt_sequence='$sd',last_update_datetime='$scri' where distributor_id='$dis_id'");
		}
		else
		{
			$sd="R00001";
			$uq_sequence =mysqli_query($con,"INSERT IGNORE INTO tbl_sequence(distributor_id,receipt_sequence,last_update_datetime)values('$dis_id','$sd','$scri')");
		}	
		$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
		$query ="INSERT IGNORE INTO tbl_party_transaction(transaction_id,transaction_date,transaction_time,transaction_bill_number,transaction_from,transaction_to,total_amount,payment_mode,payment_status,bank_name,cheque_no,cash_amount,cheque_amount,remark,cheque_date,final_amt,bill_type,source)values('$transaction_id','$da','$scro','$sd','$client1','$p_client','$amount','$pmode','$pstatus','$bank_name','$cheque_no','$cash_amt','$cheque_amt','$remark','$cheque_date','$amount','Receipt','Admin')";
		$res = mysqli_query($con,$query);	
		if($res)
		{
			$query1="SELECT transaction_id FROM  tbl_party_transaction where transaction_from ='$client1' and transaction_to='$p_client' ORDER BY `id` DESC LIMIT 1";
			$res1 = mysqli_query($con,$query1);
			$row =  mysqli_fetch_assoc($res1);
			if(mysqli_num_rows($res1)>0)
			{		
				$re= $row['transaction_id'];
				$json_a=json_decode($toder, true);     
				foreach ($json_a as $person_a)
				{
					$prodid=$person_a['pid'];
					$prodname=$person_a['pname'];
					$ordquantiy=$person_a['quantity'];
					$cgstamt=$person_a['cgst_amt'];
					$sgstamt=$person_a['sgst_amt'];
					$proprice=$person_a['pro_price'];
					$query2=mysqli_query($con,"INSERT IGNORE INTO tbl_party_transaction_detail(transaction_id,product_id,product_name,quantity, CGST_amount,SGST_amount, product_price,gst_perc)values('$re','$prodid','$prodname','$ordquantiy','$cgstamt','$sgstamt','$proprice','0')");
					
					$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
					if(mysqli_num_rows($res_stock)>0)
					{
						$row_stock =  mysqli_fetch_assoc($res_stock);
						$stock_quantity=$row_stock['closing_stock'];
						$temp_quantity=round($stock_quantity-$ordquantiy,2);
						$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scro' where date ='$da' and distributor_id='$dis_id' and product_id='$prodid'");
						$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$dis_id'");	
					}
					else
					{
						$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
						if(mysqli_num_rows($res_stock1)>0)
						{
							$row_stock1 =  mysqli_fetch_assoc($res_stock1);
							$stock_quantity=$row_stock1['closing_stock'];
							$temp_quantity=round($stock_quantity-$ordquantiy,2);
							$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$dis_id','$prodid','$stock_quantity','$temp_quantity','$da','$scro')");
							$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$dis_id'");
						}
					}
				}
			}  
			if($cash_amt>0 and $dist_dsr_require=='Yes')
			{
				$cash_coll=mysqli_query($con,"SELECT closing_amt FROM tbl_distributor_cash_collection WHERE distributor_id='$dis_id' AND date='$da'");
				if(mysqli_num_rows($cash_coll)>0)
				{
					$updt_cash_coll=mysqli_query($con,"UPDATE tbl_distributor_cash_collection SET closing_amt=round(closing_amt+$cash_amt,2) WHERE distributor_id='$dis_id' AND date='$da'");
				}
				else
				{
					$cash_coll2=mysqli_query($con,"SELECT closing_amt FROM tbl_distributor_cash_collection WHERE distributor_id='$dis_id' AND date<'$da' ORDER BY date DESC LIMIT 1");
					if(mysqli_num_rows($cash_coll2)>0)
					{
						$fetch_cash_coll2=mysqli_fetch_assoc($cash_coll2);
						$last_closing=$fetch_cash_coll2['closing_amt'];
						$closing=round($last_closing+$cash_amt,2);
						$ins_cash_coll=mysqli_query($con,"INSERT INTO tbl_distributor_cash_collection (`distributor_id`,`opening_amt`,`closing_amt`,`date`) VALUES ('$dis_id','$last_closing','$closing','$da')");
					}
					else
					{
						$ins_cash_coll=mysqli_query($con,"INSERT INTO tbl_distributor_cash_collection (`distributor_id`,`opening_amt`,`closing_amt`,`date`) VALUES ('$dis_id','0','$cash_amt','$da')");
					}
				}
			}
			// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$dis_id', 'INSERT OPERATION,Generated a receipt($pmode) of partyid:$p_client($party_place_id),(INSERT)tbl_retailer_message_detail,tbl_party_transaction,tbl_party_transaction_detail#(UPDATE+INSERT)tbl_distributor_stock,tbl_distributor_cash_collection#(UPDATE)tbl_product,tbl_sequence', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
			$response['success']=1;
			$response['details']=$sd;
			$response['pmode']=$pmode;
		}
		else
		{
			$response['success']=0;
			$response['details']="Insertion Error...!!";
		}
	}
	else
	{
		$response['success']=0;
		$response['details']="Message transaction id already exists!";
	}
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 