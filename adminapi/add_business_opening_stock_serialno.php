<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['billdate']) && isset($_POST['total_order']))
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
	$scri=date('H:i:sa');
	$pp_id1=0;
	$actual_billtype=$_POST['billtype_value'];
	$purchase_type=isset($_POST['purchase_type']) ? $_POST['purchase_type'] : 'Manually';
	$cdate=$billdate1=date('Y-m-d', strtotime('last day of previous month'));
	$toder = $_POST['total_order'];
	$remark = isset($_POST['remark']) ? $_POST['remark'] : '';
	$msg_insert_check=0;
	$uniqueId=uniqid();
	$uniqueId1="PR".strtoupper($uniqueId);
	$json_a_check=json_decode($toder, true); 
	foreach ($json_a_check as $person_a_check)
	{
		$proid=$person_a_check['pid'];
		$pro_type_check=$person_a_check['pro_type_check'];
		if($pro_type_check=="Mobile")
		{
			$temp_explode=$person_a_check['imei_detail'];
			$temp_explode1=explode(",",$temp_explode);
			for($jk=0;$jk<sizeof($temp_explode1);$jk++)
			{
				$res_product_stock = mysqli_query($con,"SELECT * FROM  tbl_product_serialno where IMEI ='$temp_explode1[$jk]' and product_id in (select product_id from tbl_product where distributor_id='$ver')");
				if(mysqli_num_rows($res_product_stock)>0)
					$msg_insert_check=1;
			}
		}
	}
	
	if($msg_insert_check==0)
	{
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
			$cess_amt=isset($person_a['cess_amount']) ? $person_a['cess_amount'] : '0';
			$pay_amt='0';
			$gst_perc=isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
			$temp_explode=$person_a['imei_detail'];
			$pro_type_check=$person_a['pro_type_check'];
			$temp_explode1=explode(",",$temp_explode);
			$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
			$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id, quantity, transaction_date, transaction_time,txn_type,total_amount,cgst_amt,sgst_amt,igst_amt,party_id,bill_date, bill_time, unique_bill,discount_amt,final_net_amt,cess_amt,remark_detail,product_price,payment_mode,payment_status,pay_amount,gst_perc,purchase_category)values('$transaction_id','$proid','$ver','$pquanity','$cdate','$scri','Add','$pamt','$pcgst','$psgst','$pigst','$pp_id1','$billdate1','$scri','$uniqueId1','0','$pfinal_net_amt','$cess_amt','$remark','$proprice','','Complete','$pay_amt','$gst_perc','Opening Stock')");
			
			if($pro_type_check=="Mobile")
			{
				for($jk=0;$jk<sizeof($temp_explode1);$jk++)
				{
					$insertQry=mysqli_query($con,"INSERT INTO `tbl_product_serialno`(`product_id`, `IMEI`, `insert_date`, `insert_time`,`status`,`unique_bill`) VALUES ('$proid','$temp_explode1[$jk]','$cdate','$scri','Available','$uniqueId1')");
				}
			}
			
			$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{
				$stock_quantity=$row_stock['closing_stock'];
				$temp_quantity=$stock_quantity+$pquanity;
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$proid'");	
			}
			else
			{
				$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
				$res_stock1 = mysqli_query($con,$query_stock1);
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				if(mysqli_num_rows($res_stock1)>0)
				{
					$stock_quantity=$row_stock1['closing_stock'];
					$temp_quantity=$stock_quantity+$pquanity;
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
				}
				else
				{
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$ver','$proid','0','$pquanity','$cdate','$scri')");
				}
			}
		}
		// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$ver', 'INSERT OPERATION,Business opening SerialNo Stock#Admin(INSERT) tbl_distributor_transaction,tbl_product_serialno#(INSERT+UPDATE)tbl_distributor_stock,tbl_product', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
		if($uq1)
		{
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
		$response['success']=0;
		$response['details']="Stock already exists!! Please Check and try again later!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>