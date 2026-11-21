<?php
include("../../connect.php");
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']) && isset($_POST['billno']) && isset($_POST['billdate']) && isset($_POST['total_order']))
{
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
	$temp_id=1;
	$pp_id1=$_POST['party_id'];
	$billno1=strtoupper($_POST['billno']);
	$billdate1=$_POST['billdate'];
	$add_pro_type=$_POST['payouttype'];
	$toder = $_POST['total_order'];
	$remark = isset($_POST['remark']) ? $_POST['remark'] : '';
	$purchase_type=isset($_POST['purchase_type']) ? $_POST['purchase_type'] : 'Manually';
	$uniqueId=uniqid();
	$uniqueId1="PR".strtoupper($uniqueId);
	
	$month = date('m');
	if($month > 4)
	{
		$fys = date('Y')."-04-01";
		$fye = date('Y', strtotime('+1 year'))."-03-31";
	}
	else
	{
		$fys = date('Y', strtotime('-1 year'))."-04-01";
		$fye = date('Y')."-03-31";
	}
	$res_purcahse_check = mysqli_query($con, "SELECT * FROM tbl_distributor_transaction where distributor_id='$ver' and txn_type='Add' and bill_no='$billno1' and bill_date>='$fys' and bill_date<='$fye' and party_id='$pp_id1'");
	if (mysqli_num_rows($res_purcahse_check)==0) 
	{
	
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$proid_lapu=$person_a['pid'];
		$proname=$person_a['pro_name'];
		$pquanity=$person_a['quantity'];
		$pcgst=$person_a['cgst_amt'];
		$psgst=$person_a['sgst_amt'];
		$igstamt=$person_a['igstamt'];
		$pamt=$person_a['total_amount'];
		$proprice=$person_a['purchase_price'];
		$gst_perc=isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
		$res_lapu = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$ver' and product_category='$add_pro_type'");
		while($fetch_LAPU=mysqli_fetch_assoc($res_lapu))
		{
			$proid=$fetch_LAPU['product_id'];
			$temp_quantity_temp=$fetch_LAPU['stock_quantity'];
		}

		$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
		$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id,quantity, transaction_date,transaction_time,txn_type,total_amount,cgst_amt,sgst_amt,party_id,bill_no,bill_date,bill_time,unique_bill,final_net_amt,remark_detail,product_price,message_txn_id,purchase_type,gst_perc,igst_amt)values('$transaction_id','$proid_lapu','$ver','$pquanity','$cdate','$scri','Add','$pamt','$pcgst','$psgst','$pp_id1','$billno1','$billdate1','$scri','$uniqueId1','$pamt','$remark','$proprice','$billno1','$purchase_type','$gst_perc','$igstamt')");
		$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
		$query_conversion = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,		distributor_id,quantity,transaction_date,transaction_time,txn_type,total_amount,cgst_amt,sgst_amt,party_id,bill_no,bill_date,bill_time,unique_bill,final_net_amt,conversion,remark_detail,product_price,message_txn_id,purchase_type,gst_perc,igst_amt)values('$transaction_id','$proid','$ver','$pquanity','$cdate','$scri','Add','$pamt','$pcgst','$psgst','$pp_id1','$billno1','$billdate1','$scri','$uniqueId1','$pamt','$proname','$remark','$proprice','$billno1','$purchase_type','$gst_perc','$igstamt')");

		if($query)		
		{			
			$set_quan=round($temp_quantity_temp+$pquanity,2);
			$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity='$set_quan',tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");

			$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
			$row_stock =  mysqli_fetch_assoc($res_stock);
			if(mysqli_num_rows($res_stock)>0)
			{
				$stock_quantity=$row_stock['closing_stock'];
				$temp_quantity=round($stock_quantity+$pquanity,2);
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
					$temp_quantity=round($stock_quantity+$pquanity,2);
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
				}
				else
				{
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id, opening_stock, closing_stock,date,time)values('$ver','$proid','0','$pquanity','$cdate','$scri')");
				}
			}
		}			
	}

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
		$response['details']="Duplicate Bill No...!!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>