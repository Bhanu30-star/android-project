<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['billno']) && isset($_POST['billdate']) && isset($_POST['total_order']))
{	
	$temp_id=1;
	$ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$da  = date("Y-m-d")." ".date('H:i:sa');
	$cdate=date("Y-m-d");
	$scri=date('H:i:sa');
	$pp_id1=$_POST['party_id'];
	$poperator = $_POST['poperator'];
	$billno1=strtoupper($_POST['billno']);
	$actual_billtype=$_POST['billtype_value'];
	$billdate1=$_POST['billdate'];
	$toder = $_POST['total_order'];
	$dist_dsr_require=$_POST['dist_dsr_require'];
	$cheq_bank_id = isset($_POST['cheque_bank_id']) ? $_POST['cheque_bank_id'] : '0';
	$uniqueId=uniqid();
	$uniqueId1="PR".strtoupper($uniqueId);
	$pmode=$_POST['pmode'];
	$pstatus=$_POST['payment_status'];
	$total_final_amt = $_POST['total_final_amt'];
	$net_final_amt = $_POST['net_final_amt'];
	$tcs_applicable = 'No';
	$pro_disc = isset($_POST['pdisc']) ? $_POST['pdisc'] : '0';
	
	$res_charges = mysqli_query($con,"INSERT INTO `tbl_distributor_transaction_charges`(`distributor_id`, `party_id`, `bill_no`, `unique_bill`, `bill_date`, `total_amt`,`is_tcs`,`net_amt`,`status`,`disc_amt`) VALUES ('$ver','$pp_id1','$billno1','$uniqueId1','$billdate1','$total_final_amt','$tcs_applicable','$net_final_amt','Complete','$pro_disc')");	
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$proid=$person_a['pid'];
		$pquanity=$person_a['quantity'];
		$pcgst=$person_a['cgst_amt'];
		$psgst=$person_a['sgst_amt'];
		$pigst=$person_a['igstamt'];
		$pamt=$person_a['total_amount'];
		$proprice=$person_a['purchase_price'];
		$pfinal_net_amt=$person_a['net_amount'];
		$pay_amt=$person_a['paid_amt'];
		$gst_perc=isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
		$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
		$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id, product_id,distributor_id, quantity, transaction_date, transaction_time,txn_type,total_amount,cgst_amt,sgst_amt,igst_amt,party_id, bill_no,bill_date, bill_time, unique_bill, final_net_amt,product_price,payment_mode,payment_status,pay_amount,gst_perc, bill_type,operator_detail,bank_id, discount_amt)values('$transaction_id','$proid','$ver','$pquanity','$cdate','$scri','Add','$pamt','$pcgst','$psgst','$pigst','$pp_id1','$billno1','$billdate1','$scri','$uniqueId1','$pfinal_net_amt','$proprice','$pmode','$pstatus','$pay_amt','$gst_perc','$actual_billtype','$poperator','$cheq_bank_id','$pro_disc')");
		
		$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
		$row_stock =  mysqli_fetch_assoc($res_stock);
		if(mysqli_num_rows($res_stock)>0)
		{
			$stock_quantity=$row_stock['closing_stock'];
			$temp_quantity=round($stock_quantity+$pquanity,2);
			$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$proid'");	
			$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
		}
		else
		{
			$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
			$res_stock1 = mysqli_query($con,$query_stock1);
			$row_stock1 =  mysqli_fetch_assoc($res_stock1);
			if(mysqli_num_rows($res_stock1)>0)
			{
				$stock_quantity=$row_stock1['closing_stock'];
				$temp_quantity=round($stock_quantity+$pquanity,2);
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$temp_quantity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			}
			else
			{
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$ver','$proid','0','$pquanity','$cdate','$scri')");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$pquanity',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			}
		}
	}
	if($uq1)
	{
		if($pmode=='Credit')
		{
			include("sale-purchase-balance-effect-class.php");
			$CashCollection=new Collectionbalance();
			$collections=$CashCollection->purchasecollection($ver,$net_final_amt,$cdate,$pp_id1);
		}
		if($dist_dsr_require=="Yes")
		{
			include("cash_bank_effect_class.php");
			if($pmode=='Cash')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasecashcollection($ver,$net_final_amt,$cdate);
			}
			else if($pmode=='Online')
			{
				$CashCollection=new Collection();
				$collections=$CashCollection->purchasebankcollection($ver,$cheq_bank_id,$net_final_amt,$cdate);
			}
		}
		$response['success']='1';
		$response['details']="Stock successfully uploaded!";
	}
	else
	{
		$response['success']=0;
		$response['details']="Insertion Error...!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>