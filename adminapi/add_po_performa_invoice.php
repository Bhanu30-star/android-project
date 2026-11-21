<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['searchparty']) && isset($_POST['distributor_id']) && isset($_POST['total_order']))
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("H:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$pp_id1=$_POST['searchparty'];
	$doc_no = isset($_POST['docno']) ? $_POST['docno'] : '';
	$btnno = isset($_POST['btnno']) ? $_POST['btnno'] : '';
	$drawing_no = isset($_POST['drawing_no']) ? $_POST['drawing_no'] : '';											
	$doc_date = isset($_POST['doc_date']) ? $_POST['doc_date'] : $da;
	$remark=mysqli_real_escape_string($con,$_POST['remark']);
	$final_amt=round($_POST['tot_amt_val'],2);
	$gst_type=$_POST['invoicegst_type'];
	$gst_applicable=$_POST['gstapplicable'];
	$order_type=$_POST['invoiceorder_type'];
	$billproducttype=$_POST['product_type'];
	$toder = $_POST['total_order'];
	$uniqueId=uniqid();
	$uniqueId1="PR".strtoupper($uniqueId);
	$res = mysqli_query($con,"INSERT INTO `tbl_party_transaction_performa`( `doc_number`, `transaction_date`, `transaction_time`, `transaction_to`, `total_amount`, `remark`, `source`, `unique_no`, `status`, `drawing_no`, `btn_no`,`invoice_type`, `gst_applicable`, `bill_type`,`unique_bill_type`) VALUES ('$doc_no','$doc_date','$scro','$pp_id1','$final_amt','$remark','Admin','$uniqueId1','Pending','$drawing_no','$btnno','$order_type','$gst_applicable','$gst_type','$billproducttype')");	
	$re = mysqli_insert_id($con);

	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$prodid=$person_a['proid'];
		$prodname=$person_a['pname'];
		$ordquantiy=$person_a['quantity'];
		$proprice=$person_a['pro_price'];
		$pbill_gst = isset($person_a['gst_perc']) ? $person_a['gst_perc'] : '0';
		$icgstamt = isset($person_a['icgstamt']) ? $person_a['icgstamt'] : '';
		$isgstamt = isset($person_a['isgstamt']) ? $person_a['isgstamt'] : '';
		$iigstamt = isset($person_a['iigstamt']) ? $person_a['iigstamt'] : '';
		$net_amt = isset($person_a['net_amt']) ? $person_a['net_amt'] : '';
		$cessamt = isset($person_a['cessamt']) ? $person_a['cessamt'] : '0';
		$query2=mysqli_query($con,"INSERT INTO `tbl_party_transaction_detail_performa`(`transaction_id`,`product_id`,`product_name`,`product_price`,`quantity`,`insert_date`, `gst_rate`,`cgst_amt`,`sgat_amt`,`igst_amt`,`pro_total_amt`, `cess_amt`)VALUES('$re','$prodid','$prodname','$proprice','$ordquantiy','$doc_date','$pbill_gst','$icgstamt','$isgstamt','$iigstamt','$net_amt','$cessamt')");

		$res_check_product = mysqli_query($con,"SELECT maintain_inventory,consumable_raw_product FROM tbl_product where distributor_id='$session_dist_ver' and product_id='$prodid'");
		$fetch_product11 =  mysqli_fetch_assoc($res_check_product);
		$pur_maintain_inventory =$fetch_product11['maintain_inventory'];
		
		if($pur_maintain_inventory=="Yes" && $fetch_product11['consumable_raw_product']=="No" && $order_type=='Performa Invoice')
		{
			$res_stock = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date ='$doc_date' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
			if(mysqli_num_rows($res_stock)>0)
			{
				$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$ordquantiy',2),time='$scro' where date ='$doc_date' and distributor_id='$session_dist_ver' and product_id='$prodid'");
				$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET opening_stock=round(opening_stock-'$ordquantiy',2), closing_stock=round(closing_stock-'$ordquantiy',2),time='$scro' where date >'$doc_date' and distributor_id='$session_dist_ver' and product_id='$prodid'");
				$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$ordquantiy',2), tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
			}
			else
			{
				$res_stock1 = mysqli_query($con,"SELECT * FROM  tbl_distributor_stock where date <='$doc_date' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
				if(mysqli_num_rows($res_stock1)>0)
				{
					$row_stock1 =  mysqli_fetch_assoc($res_stock1);
					$stock_quantity=$row_stock1['closing_stock'];
					$temp_quantity=$stock_quantity-$ordquantiy;
					$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$session_dist_ver','$prodid','$stock_quantity','$temp_quantity','$doc_date','$scro')");
					$uq1=mysqli_query($con,"UPDATE tbl_distributor_stock SET opening_stock=round(opening_stock-'$ordquantiy',2), closing_stock=round(closing_stock-'$ordquantiy',2),time='$scro' where date >'$doc_date' and distributor_id='$session_dist_ver' and product_id='$prodid'");
					$uq2=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$ordquantiy',2), tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'");
				}
			}
		}
	}
			
	$response['success']='1';
	$response['message']="Insert Successful";			
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);

?>